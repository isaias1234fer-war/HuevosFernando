import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 's3cr3t-huevos-fernando-2024';

const OWNER_USERNAME = process.env.OWNER_USERNAME || 'admin';
const OWNER_PASSWORD_HASH = bcrypt.hashSync(process.env.OWNER_PASSWORD || 'admin123', 10);

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  if (username !== OWNER_USERNAME) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const valid = await bcrypt.compare(password, OWNER_PASSWORD_HASH);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ userId: 1 }, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ message: 'Login exitoso' });
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logout exitoso' });
});
