// File: apps/api/src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { JwtPayload } from './strategies/jwt/jwt';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { v4 as uuidv4 } from 'uuid'; // Til generering af unikke tokens
import { User as CoreUser, Role as CoreRole } from '@repo/core';
import { User as PrismaUser } from '@prisma/client'; // Typen fra Prisma

@Injectable()
export class AuthService {
  private readonly saltRounds: number;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService, // Direkte adgang til PrismaService
    private readonly configService: ConfigService,
  ) {
    // Hent SALT_ROUNDS fra config, med en default værdi hvis den ikke er sat eller er ugyldig
    const saltFromEnv = this.configService.get<string | number>('SALT_ROUNDS', 10); // Default 10
    this.saltRounds = typeof saltFromEnv === 'string' ? parseInt(saltFromEnv, 10) : saltFromEnv;
    if (isNaN(this.saltRounds)) {
        console.warn(`SALT_ROUNDS var ugyldig, falder tilbage til 10. Værdi: ${saltFromEnv}`);
        this.saltRounds = 10;
    }

    // Hent JWT_SECRET og JWT_EXPIRES_IN. Disse forventes at være sat korrekt via ConfigModule.
    this.jwtSecret = this.configService.get<string>('JWT_SECRET');
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '3600s'); // Default 1 time
  }

  // Mapper en Prisma User til en CoreUser (uden passwordHash)
  private mapToCoreUser(user: PrismaUser): Omit<CoreUser, 'passwordHash'> {
    const {
      passwordHash: _passwordHash, // Ignorer passwordHash
      passwordResetToken: _passwordResetToken, // Ignorer passwordResetToken
      passwordResetExpires: _passwordResetExpires, // Ignorer passwordResetExpires
      ...rest // Resten af brugerens felter
    } = user;
    return {
      ...rest,
      role: user.role as CoreRole, // Sikrer korrekt enum type
      createdAt: new Date(user.createdAt), // Konverter til Date objekt
      updatedAt: new Date(user.updatedAt), // Konverter til Date objekt
    };
  }

  // Validerer brugerens email og password
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<CoreUser, 'passwordHash'> | null> {
    const user = await this.usersService.findOneByEmail(email); // Henter fuld Prisma User
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return this.mapToCoreUser(user); // Returnerer CoreUser uden passwordHash
    }
    return null;
  }

  // Genererer et JWT access token for en valideret bruger
  async login(
    user: Omit<CoreUser, 'passwordHash'>, // Forventer allerede CoreUser format
  ): Promise<{ access_token: string }> {
    const payload: JwtPayload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
      }),
    };
  }

  /**
   * Håndterer anmodning om nulstilling af adgangskode.
   * Genererer et unikt token, sætter en udløbstid, og gemmer det på brugeren.
   * @param email Brugerens emailadresse.
   * @returns En generisk succesmeddelelse.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findOneByEmail(email); // Henter fuld Prisma User

    // Returner altid en generisk besked for at undgå at afsløre, om en email eksisterer i systemet.
    if (!user) {
      return {
        message:
          'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.',
      };
    }

    const resetToken = uuidv4(); // Generer et unikt token
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Sæt token til at udløbe om 1 time

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: expires,
        },
      });
    } catch (error) {
      console.error("Fejl ved opdatering af password reset token i DB:", error);
      // Selvom der er en intern fejl, returner stadig generisk besked for sikkerhed.
      // Logning er vigtig her for at kunne debugge.
      return {
        message:
          'Der opstod et problem med at behandle din anmodning. Prøv igen senere.',
      };
    }
    

    // TODO: Implementer afsendelse af email med nulstillingslinket.
    // Eksempel: sendEmail(user.email, `Nulstil dit password: ${frontendUrl}/reset-password?token=${resetToken}`);
    // Log token for udviklingsformål indtil email er implementeret:
    console.log(`Password reset token for ${user.email}: ${resetToken}`);


    return {
      message:
        'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.',
    };
  }

  /**
   * Håndterer selve nulstillingen af adgangskoden med et gyldigt token.
   * @param dto Indeholder token, nyt password og bekræftelse af nyt password.
   * @returns En succesmeddelelse.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = dto;

    // Valider at de nye passwords matcher
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('De nye adgangskoder matcher ikke.');
    }

    // Find brugeren baseret på reset-tokenet
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    // Tjek om tokenet er gyldigt og ikke udløbet
    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date() // Tjek om tokenet er udløbet
    ) {
      throw new BadRequestException('Ugyldigt eller udløbet reset-token. Prøv at anmode om et nyt link.');
    }

    // Hash det nye password
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
    } catch (error) {
        console.error("Fejl under hashing af nyt password ved reset:", error);
        throw new BadRequestException("Der opstod en fejl ved behandling af dit nye password.");
    }
    

    // Opdater brugerens password og fjern reset-tokenet
    try {
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
              passwordHash: hashedPassword,
              passwordResetToken: null, // Nulstil tokenet, så det ikke kan bruges igen
              passwordResetExpires: null, // Nulstil udløbsdato
            },
          });
    } catch (dbError) {
        console.error("Fejl ved opdatering af password i DB efter reset:", dbError);
        throw new BadRequestException("Der opstod en databasefejl. Prøv igen.");
    }
    

    return { message: 'Din adgangskode er blevet nulstillet med succes.' };
  }
}