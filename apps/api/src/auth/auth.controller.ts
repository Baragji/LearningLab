// apps/api/src/auth/auth.controller.ts
import {
  Controller,
  Request, // Standard Request type fra @nestjs/common
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
import { User as CoreUser } from '@repo/core'; // Importer CoreUser fra @repo/core
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Definer en type for request objektet, der indeholder brugeren efter autentificering
interface AuthenticatedRequest extends globalThis.Request {
  // Eller Express.Request hvis du bruger @types/express
  user: Omit<CoreUser, 'passwordHash'>; // req.user er nu af typen Omit<CoreUser, 'passwordHash'>
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: AuthenticatedRequest,
    // loginDto er her for Swagger og klarhed, validering sker i LocalStrategy/AuthService
    @Body() _loginDto: LoginDto, // Prefix with underscore to indicate it's intentionally unused
  ): Promise<{ access_token: string }> {
    // req.user er sat af LocalStrategy (via AuthService.validateUser), som nu returnerer CoreUser formatet
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Request() req: AuthenticatedRequest,
  ): Omit<CoreUser, 'passwordHash'> {
    // req.user er sat af JwtStrategy, som nu returnerer Omit<PrismaUser, 'passwordHash'>,
    // men for konsistens med CoreUser, bør JwtStrategy også mappe til CoreUser hvis der er forskelle.
    // I dette tilfælde er de ens nok efter fjernelse af passwordHash.
    return req.user;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ValidationPipe()) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ValidationPipe()) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
