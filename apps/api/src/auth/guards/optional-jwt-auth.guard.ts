// apps/api/src/auth/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * En guard der tillader både autentificerede og ikke-autentificerede brugere.
 * Hvis brugeren er autentificeret, vil brugeroplysningerne være tilgængelige i request.user.
 * Hvis brugeren ikke er autentificeret, vil request.user være undefined, men requesten vil stadig blive tilladt.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Returner brugeren hvis autentificeret, ellers returner undefined (ingen fejl)
    return user;
  }
}