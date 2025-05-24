// apps/api/src/users/users.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BulkInviteUsersDto } from './dto/bulk-invite-users.dto';
import { BulkDeleteUsersDto } from './dto/bulk-delete-users.dto';
import { BulkGetUsersDto } from './dto/bulk-get-users.dto';
// Importer CoreUser og Role fra @repo/core for returtypen
import { User as CoreUser, Role } from '@repo/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { socialLinksSchema } from './schemas/social-links.schema';
import { userSettingsSchema } from './schemas/user-settings.schema';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Opret en ny bruger' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Bruger oprettet succesfuldt',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        name: { type: 'string' },
        role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN'] },
        profileImage: { type: 'string', nullable: true },
        bio: { type: 'string', nullable: true },
        socialLinks: { type: 'object', nullable: true },
        settings: { type: 'object', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 409,
    description: 'Konflikt - Email er allerede i brug',
  })
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

  @ApiOperation({ summary: 'Hent alle brugere' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Sidenummer (starter fra 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Antal resultater per side',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    description: 'Søgetekst for filtrering',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filtrer efter brugerrolle',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste af brugere',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              email: { type: 'string' },
              name: { type: 'string', nullable: true },
              role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN'] },
              profileImage: { type: 'string', nullable: true },
              bio: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('filter') filter?: string,
    @Query('role') role?: Role,
  ): Promise<{ users: Omit<CoreUser, 'passwordHash'>[]; total: number }> {
    return this.usersService.findAll(page, limit, filter, role);
  }

  @ApiOperation({ summary: 'Hent en specifik bruger' })
  @ApiParam({ name: 'id', description: 'Bruger ID' })
  @ApiResponse({
    status: 200,
    description: 'Bruger fundet',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        name: { type: 'string', nullable: true },
        role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN'] },
        profileImage: { type: 'string', nullable: true },
        bio: { type: 'string', nullable: true },
        socialLinks: { type: 'object', nullable: true },
        settings: { type: 'object', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Bruger ikke fundet',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ): Promise<Omit<CoreUser, 'passwordHash'>> {
    // Tjek om brugeren har adgang til at se denne bruger
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Du har ikke adgang til at se denne bruger');
    }

    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException(`Bruger med ID ${id} blev ikke fundet`);
    }
    return this.usersService.mapToCoreUser(user);
  }

  @ApiOperation({ summary: 'Opdater en bruger' })
  @ApiParam({ name: 'id', description: 'Bruger ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Bruger opdateret succesfuldt',
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 404,
    description: 'Bruger ikke fundet',
  })
  @ApiResponse({
    status: 409,
    description: 'Konflikt - Email er allerede i brug',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ): Promise<Omit<CoreUser, 'passwordHash'>> {
    // Tjek om brugeren har adgang til at opdatere denne bruger
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException(
        'Du har ikke adgang til at opdatere denne bruger',
      );
    }

    // Kun administratorer kan ændre roller
    if (updateUserDto.role && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Kun administratorer kan ændre brugerroller',
      );
    }

    // Tjek om brugeren eksisterer
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException(`Bruger med ID ${id} blev ikke fundet`);
    }

    return this.usersService.update(id, updateUserDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Slet en bruger (soft delete)' })
  @ApiParam({ name: 'id', description: 'Bruger ID' })
  @ApiResponse({
    status: 204,
    description: 'Bruger slettet succesfuldt',
  })
  @ApiResponse({
    status: 404,
    description: 'Bruger ikke fundet',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ): Promise<void> {
    // Tjek om brugeren eksisterer
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException(`Bruger med ID ${id} blev ikke fundet`);
    }

    // Forhindre sletning af den sidste administrator
    if (user.role === 'ADMIN') {
      const { total } = await this.usersService.findAll(
        1,
        1,
        undefined,
        Role.ADMIN,
      );
      if (total <= 1) {
        throw new ForbiddenException(
          'Kan ikke slette den sidste administrator',
        );
      }
    }

    await this.usersService.softDelete(id, currentUser.id);
  }

  @ApiOperation({ summary: 'Inviter flere brugere på én gang' })
  @ApiBody({ type: BulkInviteUsersDto })
  @ApiResponse({
    status: 201,
    description: 'Brugere inviteret succesfuldt',
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('bulk-invite')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async bulkInvite(
    @Body() bulkInviteUsersDto: BulkInviteUsersDto,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ): Promise<{ success: boolean; count: number; failed: string[] }> {
    if (
      !bulkInviteUsersDto.invitations ||
      bulkInviteUsersDto.invitations.length === 0
    ) {
      throw new BadRequestException('Ingen brugere at invitere');
    }

    return this.usersService.bulkInvite(
      bulkInviteUsersDto.invitations,
      currentUser.id,
    );
  }

  @ApiOperation({ summary: 'Slet flere brugere på én gang' })
  @ApiBody({ type: BulkDeleteUsersDto })
  @ApiResponse({
    status: 200,
    description: 'Brugere slettet succesfuldt',
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('bulk-delete')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async bulkDelete(
    @Body() bulkDeleteUsersDto: BulkDeleteUsersDto,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ): Promise<{ success: boolean; count: number }> {
    if (
      !bulkDeleteUsersDto.userIds ||
      bulkDeleteUsersDto.userIds.length === 0
    ) {
      throw new BadRequestException('Ingen brugere at slette');
    }

    // Tjek om der er administratorer blandt de brugere, der skal slettes
    const adminUsers = await this.usersService.findUsersByRoleAndIds(
      Role.ADMIN,
      bulkDeleteUsersDto.userIds,
    );

    if (adminUsers.length > 0) {
      // Tjek om der er mindst én administrator, der ikke bliver slettet
      const { total } = await this.usersService.findAll(
        1,
        1,
        undefined,
        Role.ADMIN,
      );
      if (total <= adminUsers.length) {
        throw new ForbiddenException('Kan ikke slette alle administratorer');
      }
    }

    return this.usersService.bulkDelete(
      bulkDeleteUsersDto.userIds,
      currentUser.id,
    );
  }

  @ApiOperation({ summary: 'Hent flere brugere på én gang baseret på ID' })
  @ApiBody({ type: BulkGetUsersDto })
  @ApiResponse({
    status: 200,
    description: 'Brugere hentet succesfuldt',
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('bulk-get')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async bulkGet(
    @Body() bulkGetUsersDto: BulkGetUsersDto,
  ): Promise<Omit<CoreUser, 'passwordHash'>[]> {
    if (!bulkGetUsersDto.userIds || bulkGetUsersDto.userIds.length === 0) {
      throw new BadRequestException("Ingen bruger-ID'er angivet");
    }

    return this.usersService.bulkGet(bulkGetUsersDto.userIds);
  }

  @ApiOperation({ summary: 'Valider sociale links JSON' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        socialLinks: {
          type: 'object',
          example: {
            twitter: 'https://twitter.com/username',
            linkedin: 'https://linkedin.com/in/username',
            github: 'https://github.com/username',
            website: 'https://example.com',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'JSON valideret succesfuldt',
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig JSON struktur',
  })
  @Post('validate-social-links')
  async validateSocialLinks(
    @Body('socialLinks', new ZodValidationPipe(socialLinksSchema))
    socialLinks: unknown,
  ) {
    return { valid: true, socialLinks };
  }

  @ApiOperation({ summary: 'Valider brugerindstillinger JSON' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        settings: {
          type: 'object',
          example: {
            notifications: { email: true, browser: true },
            privacy: { showProfile: true, showProgress: false },
            theme: 'system',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'JSON valideret succesfuldt',
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig JSON struktur',
  })
  @Post('validate-settings')
  async validateSettings(
    @Body('settings', new ZodValidationPipe(userSettingsSchema))
    settings: unknown,
  ) {
    return { valid: true, settings };
  }
}
