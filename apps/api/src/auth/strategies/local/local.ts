// apps/api/src/auth/strategies/local/local.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth.service';
// Importer CoreUser for at specificere returtypen korrekt
import { User as CoreUser } from '@repo/core';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Fortæller Passport at 'email' feltet skal bruges som brugernavn
  }

  // Denne metode kaldes automatisk af Passport, når LocalAuthGuard bruges
  // Returtypen er nu Omit<CoreUser, 'passwordHash'> for at matche AuthService.validateUser
  async validate(
    email: string,
    pass: string,
  ): Promise<Omit<CoreUser, 'passwordHash'>> {
    // authService.validateUser returnerer Omit<CoreUser, 'passwordHash'> | null
    const user = await this.authService.validateUser(email, pass);

    if (!user) {
      // Hvis brugeren ikke findes eller password er forkert, kast en UnauthorizedException
      throw new UnauthorizedException('Ugyldig email eller password.');
    }

    // Brugerobjektet 'user' er allerede i det korrekte CoreUser format (uden passwordHash)
    return user;
  }
}
