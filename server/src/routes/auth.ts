import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 's3cr3t-huevos-don-lucho-2024';

const OWNER_USERNAME = process.env.OWNER_USERNAME || 'admin';
const OWNER_PASSWORD_HASH = bcrypt.hashSync(process.env.OWNER_PASSWORD || 'admin123', 10);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'fvasquezperez998@gmail.com';

export const authRouter = Router();

// Registro de usuario con rol 'cliente'
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo electrónico y contraseña son obligatorios' });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const existing = await prisma.usuario.findUnique({
      where: { email: emailNorm },
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: String(nombre).trim(),
        email: emailNorm,
        password: hashedPassword,
        telefono: telefono ? String(telefono).trim() : null,
        direccion: direccion ? String(direccion).trim() : null,
        rol: 'cliente',
      },
    });

    const token = jwt.sign(
      {
        userId: usuario.id,
        role: usuario.rol,
        name: usuario.nombre,
        email: usuario.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Registro exitoso',
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        rol: usuario.rol,
      },
    });
  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: error.message || 'Error al registrar usuario' });
  }
});

// Login unificado (Admin y Clientes)
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = (username || email || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Usuario o correo y contraseña requeridos' });
    }

    // 1. Verificar si es el Administrador principal
    if (loginIdentifier === OWNER_USERNAME) {
      const valid = await bcrypt.compare(password, OWNER_PASSWORD_HASH);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { userId: 1, role: 'admin', name: 'Administrador', email: ADMIN_EMAIL },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: 1,
          nombre: 'Administrador',
          email: ADMIN_EMAIL,
          rol: 'admin',
        },
      });
    }

    // 2. Si no es el admin de entorno, buscar en la tabla Usuario
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: loginIdentifier.toLowerCase() },
          { nombre: loginIdentifier },
        ],
      },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        userId: usuario.id,
        role: usuario.rol,
        name: usuario.nombre,
        email: usuario.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        rol: usuario.rol,
      },
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Obtener información del usuario autenticado
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole === 'admin' && req.userId === 1) {
      return res.json({
        user: {
          id: 1,
          nombre: 'Administrador',
          email: ADMIN_EMAIL,
          rol: 'admin',
        },
      });
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        direccion: true,
        rol: true,
        creado_en: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: usuario });
  } catch (error: any) {
    console.error('Error en /me:', error);
    res.status(500).json({ error: 'Error al obtener datos de usuario' });
  }
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logout exitoso' });
});
