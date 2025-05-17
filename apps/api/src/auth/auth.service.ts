// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service'; // Importer UsersService for at finde brugere
import { JwtService } from '@nestjs/jwt'; // Importer JwtService for at generere tokens
import * as bcrypt from 'bcryptjs'; // Importer bcryptjs til at sammenligne passwords
import { User } from '@prisma/client'; // Importer User typen
import { JwtPayload } from './strategies/jwt/jwt'; // Importer JwtPayload interfacet (fra din jwt.strategy.ts eller jwt.ts)

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService, // Injicer UsersService
    private jwtService: JwtService,     // Injicer JwtService
  ) {}

  /**
   * Validerer en bruger baseret på email og password.
   * Bruges af LocalStrategy.
   * @param email Brugerens email
   * @param pass Brugerens password
   * @returns Brugerobjektet (uden passwordHash) hvis validering er succesfuld, ellers null.
   */
  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findOneByEmail(email); // Find brugeren via UsersService

    if (user) {
      // Sammenlign det angivne password med det hashede password i databasen
      const isPasswordMatching = await bcrypt.compare(pass, user.passwordHash);
      if (isPasswordMatching) {
        // Hvis password matcher, returner brugerobjektet (uden passwordHash)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    // Hvis bruger ikke findes eller password ikke matcher, returner null
    return null;
  }

  /**
   * Genererer et JWT access token for en valideret bruger.
   * Bruges af AuthController efter succesfuld login via LocalStrategy.
   * @param user Brugerobjektet (typisk fra req.user efter LocalAuthGuard)
   * @returns Et objekt indeholdende access_token.
   */
  async login(user: Omit<User, 'passwordHash'>): Promise<{ access_token: string }> {
    // Opret payload for JWT'en.
    // 'sub' (subject) er standard claim for bruger ID.
    // Du kan tilføje andre oplysninger til payloaden, hvis nødvendigt (f.eks. roller).
    const payload: JwtPayload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload), // Generer og returner JWT'en
    };
  }

  // Fremtidige metoder kan tilføjes her, f.eks. for refresh tokens, logout logik etc.
}
