import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 's3cr3t-huevos-don-lucho-2024';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      role?: string;
      name?: string;
      email?: string;
    };
    req.userId = decoded.userId;
    req.userRole = decoded.role || 'admin';
    req.userName = decoded.name;
    req.userEmail = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: se requieren privilegios de Administrador' });
  }
  next();
}
