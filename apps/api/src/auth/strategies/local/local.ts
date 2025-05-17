// apps/api/src/auth/strategies/local/local.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth.service'; // Justeret sti til AuthService
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Fortæller Passport at 'email' feltet skal bruges som brugernavn
  }

  // Denne metode kaldes automatisk af Passport, når LocalAuthGuard bruges
  async validate(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    // Kald AuthService for at validere brugerens email og password
    // authService.validateUser returnerer allerede Omit<User, 'passwordHash'> | null
    const user = await this.authService.validateUser(email, pass);

    if (!user) {
      // Hvis brugeren ikke findes eller password er forkert, kast en UnauthorizedException
      throw new UnauthorizedException('Ugyldig email eller password.');
    }

    // Brugerobjektet 'user' er allerede i det korrekte format (uden passwordHash),
    // da authService.validateUser håndterer fjernelsen af passwordHash.
    // Derfor kan vi returnere 'user' direkte.
    return user;
  }
}
