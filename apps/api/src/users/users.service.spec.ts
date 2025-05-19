// apps/api/src/users/users.service.spec.ts
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  ...jest.requireActual('bcryptjs'),
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Role as CoreRole } from '@repo/core';
// ÆNDRET IMPORT: Importer hele Prisma namespace
import { Prisma } from '@prisma/client';

// Definer dine Prisma-typer baseret på Prisma namespace
type PrismaUserType = Prisma.User;
type PrismaRoleType = Prisma.Role;

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockPrismaUserResult: PrismaUserType = {
  id: 1,
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  name: 'Test User',
  role: 'USER' as PrismaRoleType,
  createdAt: new Date(),
  updatedAt: new Date(),
  passwordResetToken: null,
  passwordResetExpires: null,
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    mockPrismaService.user.findUnique.mockReset();
    mockPrismaService.user.create.mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          email: createUserDto.email,
          passwordHash: 'hashedpassword',
          name: createUserDto.name,
          role: createUserDto.role as PrismaRoleType,
        }),
      }));
      expect(result).toEqual(expect.objectContaining({
        id: mockPrismaUserResult.id,
        email: mockPrismaUserResult.email,
        name: mockPrismaUserResult.name,
        role: mockPrismaUserResult.role as CoreRole,
      }));
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockPrismaUserResult);
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on hashing error', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hashing failed"));

      await expect(service.create(createUserDto)).rejects.toThrow(InternalServerErrorException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });


    it('should throw ConflictException on Prisma P2002 error during create', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      const prismaError = { code: 'P2002', meta: { target: ['email'] } };
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException on other Prisma errors during create', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockPrismaService.user.create.mockRejectedValue(new Error("Some other DB error"));

      await expect(service.create(createUserDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found', async () => {
      const email = 'test@example.com';
      mockPrismaService.user.findUnique.mockResolvedValue(mockPrismaUserResult);
      const result = await service.findOneByEmail(email);
      expect(result).toEqual(mockPrismaUserResult);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.findOneByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('should return a user if found', async () => {
      const id = 1;
      mockPrismaService.user.findUnique.mockResolvedValue(mockPrismaUserResult);
      const result = await service.findOneById(id);
      expect(result).toEqual(mockPrismaUserResult);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { id } });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.findOneById(999);
      expect(result).toBeNull();
    });
  });
});