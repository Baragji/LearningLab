// apps/api/src/auth/auth.controller.ts
import { Controller, Request, Post, UseGuards, Get, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard'; // Vi opretter denne guard snart
import { JwtAuthGuard } from './guards/jwt-auth.guard';   // Vi opretter denne guard snart
import { User as UserModel } from '@prisma/client'; // Importer User model fra Prisma
import { LoginDto } from './dto/login.dto'; // Importer LoginDto

// Definer en type for request-objektet, efter det er blevet beriget af Passport
// med brugeroplysninger (fra LocalStrategy eller JwtStrategy).
interface AuthenticatedRequest extends Request {
  user: Omit<UserModel, 'passwordHash'>; // Brugerobjektet uden passwordHash
}

@Controller('auth') // Alle ruter i denne controller vil starte med /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint til at logge en bruger ind.
   * Bruger LocalAuthGuard til at validere email og password via LocalStrategy.
   * Hvis validering er succesfuld, vil req.user indeholde brugerobjektet.
   * Kalder derefter authService.login() for at generere et JWT.
   * @param req Request objektet, som indeholder brugeroplysninger efter validering.
   * @param loginDto Body af requesten, valideres ikke direkte her, da LocalStrategy håndterer felterne.
   * Men det er god praksis at have den for Swagger og klarhed.
   * @returns Et objekt med access_token.
   */
  @UseGuards(LocalAuthGuard) // Anvend LocalAuthGuard på dette endpoint
  @Post('login')
  @HttpCode(HttpStatus.OK) // Sæt HTTP statuskode til 200 OK ved succesfuldt login
  async login(@Request() req: AuthenticatedRequest, @Body() loginDto: LoginDto): Promise<{ access_token: string }> {
    // loginDto bruges her primært for Swagger dokumentation og for at gøre det klart, hvad body skal indeholde.
    // Selve valideringen af email/password sker i LocalStrategy, som LocalAuthGuard aktiverer.
    // req.user er sat af LocalStrategy efter succesfuld validering.
    return this.authService.login(req.user);
  }

  /**
   * Et beskyttet endpoint til at hente den aktuelle brugers profil.
   * Bruger JwtAuthGuard til at sikre, at kun autentificerede brugere (med gyldigt JWT) kan tilgå dette.
   * @param req Request objektet, som indeholder brugeroplysninger efter JWT validering.
   * @returns Brugerobjektet (uden passwordHash).
   */
  @UseGuards(JwtAuthGuard) // Anvend JwtAuthGuard på dette endpoint
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest): Omit<UserModel, 'passwordHash'> {
    // req.user er sat af JwtStrategy efter succesfuld JWT validering.
    return req.user;
  }
}
