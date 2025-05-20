// apps/api/src/persistence/prisma/prisma.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

// Mock selve PrismaClient klassen
const mockPrismaClientInstance = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClientInstance),
}));

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    (PrismaClient as jest.Mock).mockClear();
    mockPrismaClientInstance.$connect.mockClear();
    mockPrismaClientInstance.$disconnect.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined and initialize PrismaClient', () => {
    expect(service).toBeDefined();
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });

  it('should call $connect on module init', async () => {
    await service.onModuleInit(); // Dette kalder this.$connect() internt
    expect(mockPrismaClientInstance.$connect).toHaveBeenCalledTimes(1);
  });
});
