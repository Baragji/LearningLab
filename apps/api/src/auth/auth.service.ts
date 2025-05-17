// apps/api/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { JwtPayload } from './strategies/jwt/jwt';
import { PrismaService } from '../persistence/prisma/prisma.service'; // Importer PrismaService
import { v4 as uuidv4 } from 'uuid'; // Til at generere unikke tokens
import { ResetPasswordDto } from './dto/reset-password.dto'; // Importer ResetPasswordDto

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService, // Injicer PrismaService for direkte databaseadgang her
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findOneByEmail(email);

    if (user) {
      const isPasswordMatching = await bcrypt.compare(pass, user.passwordHash);
      if (isPasswordMatching) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(
    user: Omit<User, 'passwordHash'>,
  ): Promise<{ access_token: string }> {
    const payload: JwtPayload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Håndterer en "glemt password" anmodning.
   * Genererer et reset token, sætter en udløbstid, og gemmer det på brugeren.
   * I en rigtig applikation ville man her sende en e-mail til brugeren med reset-linket.
   * @param email Brugerens email
   * @returns Et succes-objekt eller kaster en fejl.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      // Selvom brugeren ikke findes, returnerer vi en generisk besked for ikke at afsløre, om en email er registreret.
      // Log internt, at der blev forsøgt password reset på en ikke-eksisterende email, hvis nødvendigt for sikkerhedsovervågning.
      // console.warn(`Password reset anmodning for ikke-eksisterende email: ${email}`);
      return {
        message:
          'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.',
      };
    }

    const resetToken = uuidv4(); // Generer et unikt token
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token udløber om 1 time

    try {
      await this.prisma.user.update({
        where: { email },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: expires,
        },
      });

      // **VIGTIGT: Send e-mail til brugeren her!**
      // I en rigtig applikation skal du her integrere en e-mail service (f.eks. Nodemailer, SendGrid)
      // og sende en e-mail til user.email med et link, der indeholder resetToken.
      // F.eks.: https://din-frontend-app.com/reset-password?token=${resetToken}
      console.log(`Password Reset Token for ${email}: ${resetToken}`); // Log kun til udvikling! Fjern i produktion.

      return {
        message:
          'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.',
      };
    } catch (error) {
      console.error('Fejl under opdatering af bruger med reset token:', error);
      throw new InternalServerErrorException(
        'Der opstod en fejl under behandling af din anmodning.',
      );
    }
  }

  /**
   * Nulstiller en brugers password baseret på et gyldigt reset token.
   * @param resetPasswordDto DTO indeholdende token, nyt password og bekræftelse af password.
   * @returns Et succes-objekt eller kaster en fejl.
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('De nye passwords matcher ikke.');
    }

    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new BadRequestException(
        'Ugyldigt eller udløbet password reset token (bruger ikke fundet).',
      );
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      // Ryd tokenet hvis det er udløbet, for at undgå genbrug
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpires: null },
      });
      throw new BadRequestException(
        'Ugyldigt eller udløbet password reset token (token udløbet).',
      );
    }

    // Hash det nye password
    const saltRounds = 10;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    } catch (error) {
      console.error('Fejl under hashing af nyt password:', error);
      throw new InternalServerErrorException(
        'Der opstod en fejl under nulstilling af password (hashing).',
      );
    }

    // Opdater brugerens password og ryd reset token felterne
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          passwordResetToken: null, // Ryd tokenet efter brug
          passwordResetExpires: null, // Ryd udløbsdatoen
        },
      });

      // **VIGTIGT: Send evt. en bekræftelses-e-mail til brugeren her!**
      // Informer brugeren om, at deres password er blevet ændret.

      return { message: 'Dit password er blevet nulstillet succesfuldt.' };
    } catch (error) {
      console.error('Fejl under opdatering af brugers password:', error);
      throw new InternalServerErrorException(
        'Der opstod en fejl under nulstilling af password (database).',
      );
    }
  }
}
