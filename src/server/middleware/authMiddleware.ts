import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyhotelflow12345';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'RECEPCIONISTA' | 'CONTADOR';
    name: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
    return;
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: verified.id,
      email: verified.email,
      role: verified.role,
      name: verified.name,
    };
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}

export function authorizeRoles(roles: ('ADMIN' | 'RECEPCIONISTA' | 'CONTADOR')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
      return;
    }

    next();
  };
}
