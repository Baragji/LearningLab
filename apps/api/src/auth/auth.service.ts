// File: apps/api/src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
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
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    @Inject(forwardRef(() => UsersService)) // Brug forwardRef for at undgå cirkulære afhængigheder
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService, // Direkte adgang til PrismaService
    private readonly configService: ConfigService,
  ) {
    // Hent SALT_ROUNDS fra config, med en default værdi hvis den ikke er sat eller er ugyldig
    const saltFromEnv = this.configService.get<string | number>(
      'SALT_ROUNDS',
      10,
    ); // Default 10
    this.saltRounds =
      typeof saltFromEnv === 'string' ? parseInt(saltFromEnv, 10) : saltFromEnv;
    if (isNaN(this.saltRounds)) {
      console.warn(
        `SALT_ROUNDS var ugyldig, falder tilbage til 10. Værdi: ${saltFromEnv}`,
      );
      this.saltRounds = 10;
    }

    // Hent JWT konfiguration. Disse forventes at være sat korrekt via ConfigModule.
    this.jwtSecret = this.configService.get<string>('JWT_SECRET');
    this.jwtExpiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '900s',
    ); // Default 15 minutter
    this.jwtRefreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      this.jwtSecret + '_refresh',
    );
    this.jwtRefreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ); // Default 7 dage
  }

  // Mapper en Prisma User til en CoreUser (uden passwordHash)
  private mapToCoreUser(user: PrismaUser): Omit<CoreUser, 'passwordHash'> {
    const {
      passwordHash: _passwordHash, // Ignorer passwordHash
      passwordResetToken: _passwordResetToken, // Ignorer passwordResetToken
      passwordResetExpires: _passwordResetExpires, // Ignorer passwordResetExpires
      socialLinks,
      settings,
      ...rest // Resten af brugerens felter
    } = user;
    return {
      ...rest,
      role: user.role as CoreRole, // Sikrer korrekt enum type
      createdAt: new Date(user.createdAt), // Konverter til Date objekt
      updatedAt: new Date(user.updatedAt), // Konverter til Date objekt
      socialLinks: socialLinks as Record<string, string> | null,
      settings: settings as Record<string, unknown> | null,
    };
  }

  // Validerer brugerens email og password
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<CoreUser, 'passwordHash'> | null> {
    try {
      const user = await this.usersService.findOneByEmail(email); // Henter fuld Prisma User
      if (user && (await bcrypt.compare(password, user.passwordHash))) {
        return this.mapToCoreUser(user); // Returnerer CoreUser uden passwordHash
      }
      return null;
    } catch (error) {
      console.error('Fejl under validering af bruger:', error);
      throw new BadRequestException(
        'Der opstod en intern serverfejl ved validering af bruger. Kontroller databaseforbindelsen.',
      );
    }
  }

  // Genererer JWT access og refresh tokens for en valideret bruger
  async login(
    user: Omit<CoreUser, 'passwordHash'>, // Forventer allerede CoreUser format
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload: JwtPayload = { email: user.email, sub: user.id };

    // Generer access token med kort levetid
    const access_token = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    // Generer refresh token med længere levetid
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.jwtRefreshExpiresIn,
    });

    return {
      access_token,
      refresh_token,
    };
  }

  // Forny access token ved brug af et gyldigt refresh token
  async refreshToken(refresh_token: string): Promise<{ access_token: string }> {
    try {
      // Verificer refresh token
      const payload = this.jwtService.verify(refresh_token, {
        secret: this.jwtRefreshSecret,
      }) as JwtPayload;

      // Hent bruger for at sikre, at den stadig eksisterer
      const user = await this.usersService.findOneById(payload.sub);
      if (!user) {
        throw new Error('Bruger ikke fundet');
      }

      // Generer nyt access token
      const access_token = this.jwtService.sign(
        { email: payload.email, sub: payload.sub },
        {
          secret: this.jwtSecret,
          expiresIn: this.jwtExpiresIn,
        },
      );

      return { access_token };
    } catch (error) {
      throw new BadRequestException('Ugyldigt eller udløbet refresh token');
    }
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
      console.error('Fejl ved opdatering af password reset token i DB:', error);
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
      throw new BadRequestException(
        'Ugyldigt eller udløbet reset-token. Prøv at anmode om et nyt link.',
      );
    }

    // Hash det nye password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
    } catch (error) {
      console.error('Fejl under hashing af nyt password ved reset:', error);
      throw new BadRequestException(
        'Der opstod en fejl ved behandling af dit nye password.',
      );
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
      console.error(
        'Fejl ved opdatering af password i DB efter reset:',
        dbError,
      );
      throw new BadRequestException('Der opstod en databasefejl. Prøv igen.');
    }

    return { message: 'Din adgangskode er blevet nulstillet med succes.' };
  }
}
