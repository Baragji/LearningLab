// apps/api/src/users/users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role as CoreRole, User as CoreUser } from '@repo/core';
import { ConflictException, HttpStatus } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common'; // Tilføjet for at teste med ValidationPipe

// Mock UsersService for at isolere controlleren
const mockUsersService = {
  create: jest.fn(),
  // Tilføj andre metoder fra UsersService, hvis controlleren kommer til at bruge dem
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: typeof mockUsersService;

  beforeEach(async () => {
    mockUsersService.create.mockReset(); // Nulstil mock før hver test

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
    // Det er ikke nødvendigt at tilføje ValidationPipe globalt her for unit tests,
    // medmindre du specifikt vil teste dens integration på controller-niveau.
    // For at teste DTO validering, sker det typisk i E2E tests eller ved at kalde pipen manuelt.
    .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      role: CoreRole.USER,
    };

    const expectedUserResult: Omit<CoreUser, 'passwordHash'> = {
      id: 2,
      email: 'newuser@example.com',
      name: 'New User',
      role: CoreRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should call UsersService.create with the DTO and return the created user', async () => {
      service.create.mockResolvedValue(expectedUserResult);

      // Da ValidationPipe anvendes via @UsePipes decorator, vil den køre.
      // For en unit test af controlleren stoler vi på, at pipen virker,
      // eller tester den separat/i E2E.
      const result = await controller.signUp(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUserResult);
      // HttpStatus.CREATED (201) checkes typisk i E2E tests, da HttpCode decorator styrer NestJS's respons.
    });

    it('should propagate ConflictException if UsersService.create throws it', async () => {
      service.create.mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.signUp(createUserDto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });

    // Du kan tilføje flere tests her for andre fejltyper eller scenarier
  });
});