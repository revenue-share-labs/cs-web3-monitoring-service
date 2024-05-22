import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckError, TerminusModule } from '@nestjs/terminus';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaHealthIndicator } from './prisma.indicator';
import { PrismaService } from '../../prisma/prisma.service';

describe('PrismaIndicator', () => {
  let prismaHealthIndicator: PrismaHealthIndicator;
  let prismaService: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [PrismaHealthIndicator],
      providers: [PrismaHealthIndicator, PrismaService, ConfigService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    prismaHealthIndicator = moduleRef.get(PrismaHealthIndicator);
    prismaService = moduleRef.get(PrismaService);
  });

  it('should be defined', () => {
    expect(prismaHealthIndicator).toBeDefined();
  });

  describe('check', () => {
    it('should check db status true', async () => {
      prismaService.$runCommandRaw.mockResolvedValue({});
      expect(await prismaHealthIndicator.isHealthy('db')).toBeTruthy();
    });
    it('should check db status false', async () => {
      prismaService.$runCommandRaw.mockRejectedValue({});
      try {
        await prismaHealthIndicator.isHealthy('db');
      } catch (err) {
        expect(err).toBeInstanceOf(HealthCheckError);
      }
    });
  });
});
