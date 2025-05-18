    // apps/api/src/auth/auth.service.ts
    import {
      Injectable,
      UnauthorizedException,
      BadRequestException,
      InternalServerErrorException,
    } from '@nestjs/common';
    import { UsersService } from '../users/users.service';
    import { JwtService } from '@nestjs/jwt';
    import * as bcrypt from 'bcryptjs';
    import { User as PrismaUser } from '@prisma/client'; // PrismaUser bruges internt
    import { User as CoreUser, Role as CoreRole } from '@repo/core'; // CoreUser for eksterne kontrakter
    import { JwtPayload } from './strategies/jwt/jwt';
    import { PrismaService } from '../persistence/prisma/prisma.service';
    import { v4 as uuidv4 } from 'uuid';
    import { ResetPasswordDto } from './dto/reset-password.dto';

    @Injectable()
    export class AuthService {
      constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
      ) {}

      /**
       * Validates a user based on email and password.
       * @param email The user's email.
       * @param pass The user's password.
       * @returns A CoreUser object (without passwordHash) if validation is successful, otherwise null.
       */
      async validateUser(
        email: string,
        pass: string,
      ): Promise<Omit<CoreUser, 'passwordHash'> | null> {
        const userEntity: PrismaUser | null = await this.usersService.findOneByEmail(email);

        if (userEntity) {
          const isPasswordMatching = await bcrypt.compare(pass, userEntity.passwordHash);
          if (isPasswordMatching) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...result } = userEntity;
            // Map til CoreUser format
            return {
              ...result,
              role: userEntity.role as CoreRole, // Type assertion
              createdAt: new Date(userEntity.createdAt),
              updatedAt: new Date(userEntity.updatedAt),
            };
          }
        }
        return null;
      }

      /**
       * Generates a JWT access token for a given user.
       * @param user The user object (CoreUser format, without passwordHash).
       * @returns An object containing the access_token.
       */
      async login(
        user: Omit<CoreUser, 'passwordHash'>, // Forventer CoreUser format
      ): Promise<{ access_token: string }> {
        const payload: JwtPayload = { email: user.email, sub: user.id };
        return {
          access_token: this.jwtService.sign(payload),
        };
      }

      async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.usersService.findOneByEmail(email); // Returnerer PrismaUser
        if (!user) {
          return {
            message:
              'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.',
          };
        }

        const resetToken = uuidv4();
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

          // VIGTIGT: I en rigtig applikation, send email her!
          console.log(`Password Reset Token for ${email}: ${resetToken}`); // Kun til udvikling

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

      async resetPassword(
        resetPasswordDto: ResetPasswordDto,
      ): Promise<{ message: string }> {
        const { token, newPassword, confirmPassword } = resetPasswordDto;

        if (newPassword !== confirmPassword) {
          throw new BadRequestException('De nye passwords matcher ikke.');
        }

        const user = await this.prisma.user.findUnique({ // Arbejder med PrismaUser
          where: { passwordResetToken: token },
        });

        if (!user) {
          throw new BadRequestException(
            'Ugyldigt eller udløbet password reset token (bruger ikke fundet).',
          );
        }

        if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordResetToken: null, passwordResetExpires: null },
          });
          throw new BadRequestException(
            'Ugyldigt eller udløbet password reset token (token udløbet).',
          );
        }

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

        try {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              passwordHash: hashedPassword,
              passwordResetToken: null,
              passwordResetExpires: null,
            },
          });
          return { message: 'Dit password er blevet nulstillet succesfuldt.' };
        } catch (error) {
          console.error('Fejl under opdatering af brugers password:', error);
          throw new InternalServerErrorException(
            'Der opstod en fejl under nulstilling af password (database).',
          );
        }
      }
    }
    