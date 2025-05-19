// apps/api/src/app.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// PrismaService mockes for at undgå databaseafhængighed, selvom AppService måske ikke bruger den direkte.
// Det gør testen mere robust over for ændringer i AppService's afhængigheder.
import { PrismaService } from './persistence/prisma/prisma.service';

// Mock implementation for PrismaService - kan være tom, hvis AppService ikke interagerer med den.
const mockPrismaService = {};

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
    appService = moduleRef.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Hello World!"', async () => {
      const expectedResult = { message: 'Hello World' };
      // Spy på appService.getHello for at sikre, at den kaldes, og for at kontrollere dens output.
      jest.spyOn(appService, 'getHello').mockResolvedValue(expectedResult);

      expect(await appController.getHello()).toBe(expectedResult);
      expect(appService.getHello).toHaveBeenCalled();
    });
  });
});