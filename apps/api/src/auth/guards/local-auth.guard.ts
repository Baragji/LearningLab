// apps/api/src/auth/guards/local-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * A guard that invokes the local Passport strategy.
 * It automatically handles the logic of calling the LocalStrategy's validate() method
 * and setting up req.user upon successful authentication.
 * If authentication fails, it automatically sends a 401 Unauthorized response.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
