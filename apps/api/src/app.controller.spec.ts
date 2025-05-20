// apps/api/src/app.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './persistence/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

const mockPrismaService = {};
const mockConfigService = { get: jest.fn() };

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
    appService = moduleRef.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Hello World!"', async () => {
      const expectedResult = { message: 'Hello World' };
      jest.spyOn(appService, 'getHello').mockResolvedValue(expectedResult);
      expect(await appController.getHello()).toBe(expectedResult);
    });
  });
});
