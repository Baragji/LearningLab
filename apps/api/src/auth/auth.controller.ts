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
  Res,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
// Social login guards er deaktiveret indtil de skal bruges i produktion
// import { GoogleAuthGuard } from './guards/google-auth.guard';
// import { GithubAuthGuard } from './guards/github-auth.guard';
import { User as CoreUser } from '@repo/core'; // Importer CoreUser fra @repo/core
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

// Definer en type for request objektet, der indeholder brugeren efter autentificering
interface AuthenticatedRequest extends globalThis.Request {
  // Eller Express.Request hvis du bruger @types/express
  user: Omit<CoreUser, 'passwordHash'>; // req.user er nu af typen Omit<CoreUser, 'passwordHash'>
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Log ind med email og password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Bruger logget ind succesfuldt',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Uautoriseret - Ugyldige loginoplysninger',
  })
  @ApiResponse({
    status: 429,
    description: 'For mange forsøg - Prøv igen senere',
  })
  @UseGuards(LoginThrottlerGuard, LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: AuthenticatedRequest,
    // loginDto er her for Swagger og klarhed, validering sker i LocalStrategy/AuthService
    @Body() _loginDto: LoginDto, // Prefix with underscore to indicate it's intentionally unused
  ): Promise<{ access_token: string; refresh_token: string }> {
    // req.user er sat af LocalStrategy (via AuthService.validateUser), som nu returnerer CoreUser formatet
    return this.authService.login(req.user);
  }

  @ApiOperation({ summary: 'Hent brugerens profil' })
  @ApiResponse({
    status: 200,
    description: 'Brugerens profildata',
  })
  @ApiResponse({
    status: 401,
    description: 'Uautoriseret - Ugyldig eller udløbet token',
  })
  @ApiBearerAuth()
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

  @ApiOperation({ summary: 'Anmod om nulstilling af password' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Anmodning om nulstilling af password modtaget',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'For mange forsøg - Prøv igen senere',
  })
  @UseGuards(LoginThrottlerGuard)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ValidationPipe()) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @ApiOperation({ summary: 'Nulstil password med token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password nulstillet succesfuldt',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Ugyldig eller udløbet token' })
  @ApiResponse({
    status: 429,
    description: 'For mange forsøg - Prøv igen senere',
  })
  @UseGuards(LoginThrottlerGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ValidationPipe()) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiOperation({ summary: 'Forny adgangstoken med refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Nyt adgangstoken genereret',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Ugyldig eller udløbet refresh token',
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body(new ValidationPipe()) refreshTokenDto: RefreshTokenDto,
  ): Promise<{ access_token: string }> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  // Social login endpoints er deaktiveret indtil de skal bruges i produktion
  /*
  // Google Auth endpoints
  @ApiOperation({ summary: 'Start Google OAuth login flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirect til Google login',
  })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirecter til Google
    return { msg: 'Google Authentication' };
  }

  @ApiExcludeEndpoint() // Skjul fra Swagger da det er en callback URL
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.login(req.user);
    const frontendURL = this.configService.get<string>('socialAuth.frontendURL');
    
    // Redirect til frontend med tokens som query params
    return res.redirect(
      `${frontendURL}/auth/social-callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`,
    );
  }

  // GitHub Auth endpoints
  @ApiOperation({ summary: 'Start GitHub OAuth login flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirect til GitHub login',
  })
  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubAuth() {
    // Guard redirecter til GitHub
    return { msg: 'GitHub Authentication' };
  }

  @ApiExcludeEndpoint() // Skjul fra Swagger da det er en callback URL
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.login(req.user);
    const frontendURL = this.configService.get<string>('socialAuth.frontendURL');
    
    // Redirect til frontend med tokens som query params
    return res.redirect(
      `${frontendURL}/auth/social-callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`,
    );
  }
  */
}
