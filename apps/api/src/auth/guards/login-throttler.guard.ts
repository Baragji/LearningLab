// apps/api/src/auth/guards/login-throttler.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    // Brug både IP og email (hvis tilgængelig) for at forhindre brute force-angreb
    const email = req.body?.email || 'anonymous';
    return Promise.resolve(`${req.ip}-${email}`);
  }
}
