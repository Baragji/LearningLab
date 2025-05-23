// apps/api/src/common/middleware/user-identification.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware der identificerer brugeren fra JWT-token og tilføjer bruger-ID til request-objektet
 * Dette gør det muligt at spore, hvilken bruger der foretager ændringer
 */
@Injectable()
export class UserIdentificationMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Fjern 'Bearer ' fra header
      
      try {
        const decoded = this.jwtService.verify(token);
        // Tilføj bruger-ID til request-objektet, så det er tilgængeligt i controllere
        req['userId'] = decoded.sub;
      } catch (error) {
        // Token er ugyldig, men lad anmodningen fortsætte
        // Bruger-ID vil ikke være tilgængeligt, men det er OK for nogle endpoints
      }
    }
    
    next();
  }
}