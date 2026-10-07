import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getInventario } from '../services/inventario';
import { getLotes, getResumenVencimientos } from '../services/lotes';

export const inventarioRouter = Router();

inventarioRouter.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const inventario = await getInventario();
    res.json(inventario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

inventarioRouter.get('/lotes', async (_req: AuthRequest, res: Response) => {
  try {
    const lotes = await getLotes();
    res.json(lotes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener lotes' });
  }
});

inventarioRouter.get('/vencimientos', async (_req: AuthRequest, res: Response) => {
  try {
    const vencimientos = await getResumenVencimientos();
    res.json(vencimientos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vencimientos' });
  }
});

inventarioRouter.get('/catalogo', async (_req: AuthRequest, res: Response) => {
  try {
    const inventario = await getInventario();
    const catalogo = inventario.map((item) => {
      const precioJaba = Number(item.precio_venta_jaba);
      const isPrimera = item.calidad_nombre.toLowerCase().includes('primera');
      const isCuarta = item.calidad_nombre.toLowerCase().includes('cuarta');

      return {
        id: item.calidad_id,
        nombre: item.calidad_nombre,
        descripcion: isPrimera
          ? 'Huevos seleccionados de máxima frescura, cáscara uniforme y peso óptimo. Ideales para consumo directo y comercio exigente.'
          : isCuarta
          ? 'Huevos económicos seleccionados para repostería, pastelería e industria culinaria de alto volumen.'
          : 'Huevos frescos de producción avícola garantizada.',
        imagen: isPrimera
          ? '/images/huevos-primera.svg'
          : isCuarta
          ? '/images/huevos-cuarta.svg'
          : '/images/huevos-primera.svg',
        tag: isPrimera ? 'Calidad Premium' : isCuarta ? 'Ahorro & Repostería' : 'Estándar',
        badgeColor: isPrimera ? 'emerald' : isCuarta ? 'amber' : 'slate',
        stock_jabas: item.disponible_jabas,
        stock_paquetes: Math.max(0, Math.floor(item.disponible_jabas * 2)),
        stock_celdas: Math.max(0, Math.floor(item.disponible_jabas * 12)),
        precios: {
          jaba: precioJaba,
          paquete: Number((precioJaba / 2).toFixed(2)),
          celda: Number((precioJaba / 12).toFixed(2)),
        },
      };
    });

    res.json(catalogo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener catálogo' });
  }
});
