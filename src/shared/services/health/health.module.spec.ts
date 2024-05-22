import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthModule } from './health.module';

describe('HealthModule', () => {
  it('should compile the module', async () => {
    const healthModule: HealthModule = await Test.createTestingModule({
      imports: [HealthModule, PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    expect(healthModule).toBeDefined();
  });
});
