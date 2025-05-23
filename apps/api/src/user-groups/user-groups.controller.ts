// apps/api/src/user-groups/user-groups.controller.ts
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
import { UserGroupsService } from './user-groups.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { AddUsersToGroupDto } from './dto/add-users-to-group.dto';
import { User as CoreUser, Role } from '@repo/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('User Groups')
@Controller('user-groups')
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  @ApiOperation({ summary: 'Opret en ny brugergruppe' })
  @ApiBody({ type: CreateUserGroupDto })
  @ApiResponse({
    status: 201,
    description: 'Brugergruppe oprettet succesfuldt',
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 409,
    description: 'Konflikt - Gruppenavn er allerede i brug',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserGroupDto: CreateUserGroupDto,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ) {
    return this.userGroupsService.create(createUserGroupDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Hent alle brugergrupper' })
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
  @ApiResponse({
    status: 200,
    description: 'Liste af brugergrupper',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('filter') filter?: string,
  ) {
    return this.userGroupsService.findAll(page, limit, filter);
  }

  @ApiOperation({ summary: 'Hent en specifik brugergruppe' })
  @ApiParam({ name: 'id', description: 'Brugergruppe ID' })
  @ApiResponse({
    status: 200,
    description: 'Brugergruppe fundet',
  })
  @ApiResponse({
    status: 404,
    description: 'Brugergruppe ikke fundet',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const userGroup = await this.userGroupsService.findOneById(id);
    if (!userGroup) {
      throw new NotFoundException(`Brugergruppe med ID ${id} blev ikke fundet`);
    }
    return userGroup;
  }

  @ApiOperation({ summary: 'Opdater en brugergruppe' })
  @ApiParam({ name: 'id', description: 'Brugergruppe ID' })
  @ApiBody({ type: UpdateUserGroupDto })
  @ApiResponse({
    status: 200,
    description: 'Brugergruppe opdateret succesfuldt',
  })
  @ApiResponse({
    status: 400,
    description: 'Ugyldig anmodning - Valideringsfejl',
  })
  @ApiResponse({
    status: 404,
    description: 'Brugergruppe ikke fundet',
  })
  @ApiResponse({
    status: 409,
    description: 'Konflikt - Gruppenavn er allerede i brug',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
    @Body() updateUserGroupDto: UpdateUserGroupDto,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ) {
    // Tjek om brugergruppen eksisterer
    const userGroup = await this.userGroupsService.findOneById(id);
    if (!userGroup) {
      throw new NotFoundException(`Brugergruppe med ID ${id} blev ikke fundet`);
    }

    return this.userGroupsService.update(
      id,
      updateUserGroupDto,
      currentUser.id,
    );
  }

  @ApiOperation({ summary: 'Slet en brugergruppe (soft delete)' })
  @ApiParam({ name: 'id', description: 'Brugergruppe ID' })
  @ApiResponse({
    status: 204,
    description: 'Brugergruppe slettet succesfuldt',
  })
  @ApiResponse({
    status: 404,
    description: 'Brugergruppe ikke fundet',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ) {
    // Tjek om brugergruppen eksisterer
    const userGroup = await this.userGroupsService.findOneById(id);
    if (!userGroup) {
      throw new NotFoundException(`Brugergruppe med ID ${id} blev ikke fundet`);
    }

    await this.userGroupsService.softDelete(id, currentUser.id);
  }

  @ApiOperation({ summary: 'Hent brugere i en brugergruppe' })
  @ApiParam({ name: 'id', description: 'Brugergruppe ID' })
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
  @ApiResponse({
    status: 200,
    description: 'Liste af brugere i gruppen',
  })
  @ApiResponse({
    status: 404,
    description: 'Brugergruppe ikke fundet',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id/users')
  async getGroupUsers(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    // Tjek om brugergruppen eksisterer
    const userGroup = await this.userGroupsService.findOneById(id);
    if (!userGroup) {
      throw new NotFoundException(`Brugergruppe med ID ${id} blev ikke fundet`);
    }

    return this.userGroupsService.getGroupUsers(id, page, limit);
  }

  @ApiOperation({ summary: 'Tilføj brugere til en brugergruppe' })
  @ApiParam({ name: 'id', description: 'Brugergruppe ID' })
  @ApiBody({ type: AddUsersToGroupDto })
  @ApiResponse({
    status: 200,
    description: 'Brugere tilføjet til gruppen succesfuldt',
  })
  @ApiResponse({
    status: 404,
    description: 'Brugergruppe eller brugere ikke fundet',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/users')
  async addUsersToGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() addUsersToGroupDto: AddUsersToGroupDto,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ) {
    // Tjek om brugergruppen eksisterer
    const userGroup = await this.userGroupsService.findOneById(id);
    if (!userGroup) {
      throw new NotFoundException(`Brugergruppe med ID ${id} blev ikke fundet`);
    }

    return this.userGroupsService.addUsersToGroup(
      id,
      addUsersToGroupDto.userIds,
      currentUser.id,
    );
  }

  @ApiOperation({ summary: 'Fjern en bruger fra en brugergruppe' })
  @ApiParam({ name: 'id', description: 'Brugergruppe ID' })
  @ApiParam({ name: 'userId', description: 'Bruger ID' })
  @ApiResponse({
    status: 204,
    description: 'Bruger fjernet fra gruppen succesfuldt',
  })
  @ApiResponse({
    status: 404,
    description: 'Brugergruppe eller bruger ikke fundet',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeUserFromGroup(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: Omit<CoreUser, 'passwordHash'>,
  ) {
    // Tjek om brugergruppen eksisterer
    const userGroup = await this.userGroupsService.findOneById(id);
    if (!userGroup) {
      throw new NotFoundException(`Brugergruppe med ID ${id} blev ikke fundet`);
    }

    await this.userGroupsService.removeUserFromGroup(
      id,
      userId,
      currentUser.id,
    );
  }
}
