// apps/api/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { Role } from '@repo/core';
import jwt from 'jsonwebtoken';

// JWT authentication middleware
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: 'Adgang nægtet. Ingen token angivet.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key',
    );
    req.user = decoded as Express.User;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Ugyldig eller udløbet token.' });
  }
};

// Admin authorization middleware
export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: 'Adgang nægtet. Ikke autentificeret.' });
  }

  if ((req.user as any).role !== Role.ADMIN) {
    return res
      .status(403)
      .json({ message: 'Adgang nægtet. Kræver admin-rettigheder.' });
  }

  next();
};
