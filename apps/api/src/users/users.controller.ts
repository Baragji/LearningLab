// apps/api/src/users/users.controller.ts
import { Controller, Post, Body, ValidationPipe, UsePipes, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client'; // Importer User type for returtypen

@Controller('users') // Alle ruter i denne controller vil starte med /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Definerer en POST-rute til /users/signup
  // @UsePipes(...) aktiverer automatisk validering af request body'en baseret på CreateUserDto
  // @HttpCode(...) sætter HTTP statuskoden til 201 Created ved succesfuld oprettelse
  @Post('signup')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    // @Body() decorator tager request body'en og mapper den til createUserDto
    // UsersService.create kaldes for at håndtere selve brugeroprettelsen
    return this.usersService.create(createUserDto);
  }

  // Her kan andre endpoints tilføjes senere, f.eks.:
  // @Get()
  // findAll() { ... }

  // @Get(':id')
  // findOne(@Param('id') id: string) { ... }
}
