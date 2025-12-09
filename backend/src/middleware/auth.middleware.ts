import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { verifyToken } from '../utils/auth.utils';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = verifyToken(token);

    // Attach user info to request
    (req as AuthRequest).user = {
      id: decoded.id,
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(401, 'Invalid or expired token'));
    }
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const reqUser = (req as any).user;
  if (!reqUser) {
    throw new AppError(401, 'Authentication required');
  }

  if (reqUser.role !== 'admin') {
    throw new AppError(403, 'Admin access required');
  }

  next();
};
