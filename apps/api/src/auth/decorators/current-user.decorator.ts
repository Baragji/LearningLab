import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@repo/core';

/**
 * Decorator til at hente den aktuelle bruger fra request objektet.
 * Bruges i controller metoder for at få adgang til den autentificerede bruger.
 *
 * Eksempel:
 * ```
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Omit<User, 'passwordHash'> => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
