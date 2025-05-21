// apps/api/src/types/express.d.ts
import { User as CoreUser } from '@repo/core'; // Antager at din User type fra @repo/core er den, du vil bruge

// Udvid det globale Express Request interface
declare global {
  namespace Express {
    export interface Request {
      user?: CoreUser; // Gør brugerobjektet valgfrit på det generelle Request interface
    }
  }
}

// Definer og eksporter AuthenticatedRequest interfacet specifikt til ruter,
// hvor brugeren er garanteret at være autentificeret (f.eks. efter JwtAuthGuard).
export interface AuthenticatedRequest extends Express.Request { // Extends Express.Request for better type accuracy
  user: CoreUser; // Her er 'user' påkrævet og af typen CoreUser
}

// Denne tomme eksport sikrer, at filen behandles som et ES-modul af TypeScript.
export {};
