// apps/api/src/users/users.service.spec.ts
import * as bcrypt from 'bcryptjs';

// Mock bcryptjs modulet HELT ØVERST (før alle andre imports)
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../persistence/prisma/prisma.service';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Role as CoreRole } from '@repo/core';
import {
  Prisma,
  User as PrismaGeneratedUserType,
  Role as PrismaGeneratedRoleType,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { ServerEnv } from '@repo/config';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockPrismaUserResult: PrismaGeneratedUserType = {
  id: 1,
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  name: 'Test User',
  role: 'USER' as PrismaGeneratedRoleType,
  createdAt: new Date(),
  updatedAt: new Date(),
  passwordResetToken: null,
  passwordResetExpires: null,
};

const mockConfigService = {
  get: jest.fn((key: keyof ServerEnv) => {
    if (key === 'SALT_ROUNDS') {
      return 10; // Default værdi for tests
    }
    return undefined;
  }),
};

describe('UsersService', () => {
  let service: UsersService;

  let consoleErrorSpy: jest.SpyInstance;
  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(async () => {
    mockPrismaService.user.findUnique.mockReset();
    mockPrismaService.user.create.mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    mockConfigService.get.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: CoreRole.USER,
    };

    it('should create and return a user if email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockPrismaUserResult);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.create(createUserDto);

      expect(mockConfigService.get).toHaveBeenCalledWith('SALT_ROUNDS', {
        infer: true,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: createUserDto.email,
            passwordHash: 'hashedpassword',
          }),
        }),
      );
      expect(result.email).toEqual(mockPrismaUserResult.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockPrismaUserResult);
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException on hashing error', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));
      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(console.error).toHaveBeenCalledWith(
        'Fejl under hashing af password:',
        expect.any(Error),
      );
    });

    it('should throw ConflictException on Prisma P2002 error during create', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: 'test', meta: { target: ['email'] } },
      );
      mockPrismaService.user.create.mockRejectedValue(prismaError);
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException on other Prisma errors during create', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockPrismaService.user.create.mockRejectedValue(
        new Error('Some other DB error'),
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(console.error).toHaveBeenCalledWith(
        'Databasefejl under brugeroprettelse:',
        expect.any(Error),
      );
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockPrismaUserResult);
      const result = await service.findOneByEmail('test@example.com');
      expect(result).toEqual(mockPrismaUserResult);
    });
  });

  describe('findOneById', () => {
    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockPrismaUserResult);
      const result = await service.findOneById(1);
      expect(result).toEqual(mockPrismaUserResult);
    });
  });
});
