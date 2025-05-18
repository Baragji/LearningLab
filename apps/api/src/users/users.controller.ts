// apps/api/src/users/users.controller.ts
import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
// Importer CoreUser fra @repo/core for returtypen
import { User as CoreUser } from '@repo/core';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  // Returtypen er nu Omit<CoreUser, 'passwordHash'> for at matche UsersService.create
  async signUp(
    @Body() createUserDto: CreateUserDto,
  ): Promise<Omit<CoreUser, 'passwordHash'>> {
    return this.usersService.create(createUserDto);
  }
}
