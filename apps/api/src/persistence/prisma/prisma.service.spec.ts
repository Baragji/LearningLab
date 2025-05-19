// apps/api/src/persistence/prisma/prisma.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
// Importer IKKE PrismaClient her, da vi vil mocke dens adfærd på PrismaService instansen

describe('PrismaService', () => {
  let service: PrismaService;
  let mockConnect: jest.Mock;
  let mockDisconnect: jest.Mock; // Tilføjet for fuldstændighed, hvis du tester onModuleDestroy

  beforeEach(async () => {
    mockConnect = jest.fn().mockResolvedValue(undefined);
    mockDisconnect = jest.fn().mockResolvedValue(undefined);

    // Vi opretter en "spy" på PrismaService's prototype for $connect.
    // Dette er en mere direkte måde at mocke metoder på en klasse, der extender en anden.
    // Det antager, at PrismaService arver $connect fra PrismaClient.
    jest.spyOn(PrismaService.prototype, '$connect' as any).mockImplementation(mockConnect);
    jest.spyOn(PrismaService.prototype, '$disconnect' as any).mockImplementation(mockDisconnect);


    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    // Gendan de originale metoder efter hver test for at undgå sideeffekter
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call $connect on module init', async () => {
    // onModuleInit er en metode direkte på PrismaService, den burde være tilgængelig.
    // Når onModuleInit kalder 'await this.$connect()', vil vores mockConnect blive kaldt.
    await service.onModuleInit();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  // Eksempel hvis du implementerer OnModuleDestroy
  // it('should call $disconnect on module destroy', async () => {
  //   if (typeof service.onModuleDestroy === 'function') {
  //     await service.onModuleDestroy(); // Antaget at du implementerer OnModuleDestroy
  //     expect(mockDisconnect).toHaveBeenCalledTimes(1);
  //   }
  // });
});