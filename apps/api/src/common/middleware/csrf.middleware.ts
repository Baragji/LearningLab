// apps/api/src/common/middleware/csrf.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Extend the Express Request interface to include csrfToken method
interface CsrfRequest extends Request {
  csrfToken(): string;
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: CsrfRequest, res: Response, next: NextFunction) {
    // Sæt CSRF token i response header, så frontend kan bruge det
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
      httpOnly: false, // Frontend skal kunne læse denne cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    next();
  }
}
