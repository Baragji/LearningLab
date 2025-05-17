// apps/api/src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * A guard that invokes the jwt Passport strategy.
 * It automatically handles the logic of verifying the JWT, calling the JwtStrategy's validate() method,
 * and setting up req.user upon successful authentication.
 * If authentication fails (e.g., invalid token, expired token), it automatically sends a 401 Unauthorized response.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Du kan overskrive handleRequest for at tilpasse fejlhåndtering eller logik efter validering.
  // For de fleste standardtilfælde er det dog ikke nødvendigt.
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    // Du kan smide en exception her baseret på 'info' eller 'err' argumenterne
    if (err || !user) {
      // Log eventuelle fejl eller information for debugging
      // console.error('JWT Auth Guard Error:', err);
      // console.error('JWT Auth Guard Info:', info);
      throw err || new UnauthorizedException('Du har ikke adgang eller dit token er ugyldigt.');
    }
    return user;
  }
}
