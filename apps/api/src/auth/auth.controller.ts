// apps/api/src/auth/auth.controller.ts
import {
  Controller,
  Request,
  Post,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Body,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User as UserModel } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto'; // Importer ForgotPasswordDto
import { ResetPasswordDto } from './dto/reset-password.dto'; // Importer ResetPasswordDto

interface AuthenticatedRequest extends Request {
  user: Omit<UserModel, 'passwordHash'>;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: AuthenticatedRequest,
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string }> {
    // loginDto er her for Swagger og klarhed, validering sker i LocalStrategy
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Request() req: AuthenticatedRequest,
  ): Omit<UserModel, 'passwordHash'> {
    return req.user;
  }

  /**
   * Endpoint til at anmode om nulstilling af password.
   * @param forgotPasswordDto DTO indeholdende brugerens email.
   * @returns En succesbesked.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK) // Returnerer 200 OK, da vi ikke vil afsløre om emailen findes
  async forgotPassword(
    @Body(new ValidationPipe()) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Endpoint til at nulstille password med et gyldigt token.
   * @param resetPasswordDto DTO indeholdende token, nyt password og bekræftelse.
   * @returns En succesbesked.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ValidationPipe()) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
